import sys
import oci
import requests

def transcribe_audio(file_url):
    # config = oci.config.from_file()
    # Especifica la ruta del archivo de configuración
    # config_path = "C:/Users/aless/sa-bogota-1"

    # Carga la configuración desde el archivo
    config = oci.config.from_file("config.oci")
    compart = "ocid1.tenancy.oc1..aaaaaaaaayjnj7nztfs7xro2n55siv2625cd2slneyzbsjzzj645lr3w3lga"

    # ------------------------OBJECT STORAGE CLIENT------------------------
    bucket_name = "my-bucket"
    object_storage_client = oci.object_storage.ObjectStorageClient(config)
    namespace = object_storage_client.get_namespace().data

    # Descarga el archivo de la URL
    response = requests.get(file_url)
    if response.status_code != 200:
        print("Error al descargar el archivo")
        return

    # Guarda el contenido del archivo en una variable
    audio_data = response.content


    # --------------------------SUBIR UN ARCHIVO--------------------------

    object_storage = oci.object_storage.ObjectStorageClient(config)

    # Ejemplo de cómo leer el contenido del archivo de audio
    # with open(file_path, "rb") as audio_file:
    #     audio_data = audio_file.read()

    object_name="corto.mp3"
    # with open(file_path, "rb") as f:
    put_object_response = object_storage.put_object(
        namespace_name=namespace,
        bucket_name = bucket_name, 
        object_name = object_name,
        # file_path.split("/")[-1], 
        put_object_body = audio_data)

    file_path=object_name
    # re-run the list command on the bucket to check if the new file is present:
    objects = object_storage_client.list_objects(namespace, bucket_name).data
    count = 1
    for i in objects.objects:
        # print("Object ",count,": ",i.name)
        count+=1


    file_name="new_file"
    # --------------------------INICIA OCI SPEECH--------------------------
    # Initialize service client with default config file
    ai_speech_client = oci.ai_speech.AIServiceSpeechClient(config)

    create_transcription_job_response = ai_speech_client.create_transcription_job(
    
        create_transcription_job_details=oci.ai_speech.models.CreateTranscriptionJobDetails(
        
            compartment_id=compart,

            input_location=oci.ai_speech.models.ObjectListInlineInputLocation(
                location_type="OBJECT_LIST_INLINE_INPUT_LOCATION",
                object_locations=[
                    oci.ai_speech.models.ObjectLocation(
                        namespace_name=namespace,
                        bucket_name=bucket_name,
                        object_names=[file_path])]),

            output_location=oci.ai_speech.models.OutputLocation(
                namespace_name=namespace,
                bucket_name=bucket_name),
    #            prefix="res-"),
            additional_transcription_formats=["SRT"],

            display_name=file_path,

            # description="NuevaDescripcion",

            model_details=oci.ai_speech.models.TranscriptionModelDetails(
                model_type="ORACLE",
                domain="GENERIC",
                language_code="es-ES",
                transcription_settings=oci.ai_speech.models.TranscriptionSettings(
                    diarization=oci.ai_speech.models.Diarization(
                        is_diarization_enabled=False,
                        number_of_speakers=2
                        ))),

            normalization=oci.ai_speech.models.TranscriptionNormalization(
                is_punctuation_enabled=True,
                filters=[
                    oci.ai_speech.models.ProfanityTranscriptionFilter(
                        type="PROFANITY",
                        mode="TAG")]),
        ))


    # ----------------------------------VER RESULTADO----------------------------------
    # List the available jobs to see the status, and detect when it has finished

    ai_speech_client = oci.ai_speech.AIServiceSpeechClient(config)


    list_transcription_jobs_response = ai_speech_client.list_transcription_jobs(
        compartment_id=compart)

    # Get the data from response
    #print(list_transcription_jobs_response.data)

    ct=0
    for i in list_transcription_jobs_response.data.items:
        # print("Job no. ",ct,", date= ", list_transcription_jobs_response.data.items[ct].time_accepted,
        #      ", Status = ", list_transcription_jobs_response.data.items[ct].lifecycle_state) 
        ct+=1

    # You should see one job in the "In Progress" status.
    # Get the data from response
    import time

    # Get a few elements from the job to create the get_transcription_job call : 
    job_id = create_transcription_job_response.data.id
    # print ("Job ID: ", job_id)

    out_loc = create_transcription_job_response.data.output_location.prefix
    # print ("Location: ", out_loc)

    while True:
        get_transcription_job_response = ai_speech_client.get_transcription_job(
            transcription_job_id=job_id)
        # print(get_transcription_job_response.data.lifecycle_state, " at ", time.ctime())
        if get_transcription_job_response.data.lifecycle_state == "SUCCEEDED":
            break
        time.sleep(5)
        

    # Get the original filename
    ori_name = get_transcription_job_response.data.input_location.object_locations[0].object_names[0]
    # print("Original name = ",ori_name)

    # Compose the path to the result file:
    res_file = out_loc + namespace + "_" + bucket_name + "_" + ori_name +".json"
    # print("Result filename: ", res_file)

    import json

    # Send the request to service, some parameters are not required, see API
    # doc for more info
    get_object_response = object_storage_client.get_object(
        namespace_name=namespace,
        bucket_name=bucket_name,
        http_response_content_type = 'text/plain',
        object_name=res_file)


    # Load the data into a JSON object
    data = json.loads(get_object_response.data.content)

    transcription = data['transcriptions'][0]['transcription']
    # Print the transcript text
    print(transcription)

    return transcription

##########################
if __name__ == "__main__":
    # Obtener la ruta del archivo de audio del argumento de línea de comandos
    if len(sys.argv) != 2:
        print("Uso: python transcribe.py <ruta_al_archivo_de_audio>")
        sys.exit(1)
    
    file_path = sys.argv[1]

    # Llamar a la función para transcribir el audio
    transcription_text = transcribe_audio(file_path)

    # Imprimir o devolver los resultados de la transcripción
    print("Transcripción del audio:")
    print(transcription_text)
